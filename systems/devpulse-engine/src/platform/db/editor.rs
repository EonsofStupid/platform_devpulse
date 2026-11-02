//! Table editor — read a Turso database's tables, columns and rows, and
//! change rows. The engine side of the database devtool.
//!
//! Follows the pattern Supabase's Table Editor, Prisma Studio and DB Browser
//! for `SQLite` share: list tables from the catalog, read each table's columns
//! from `PRAGMA table_info`, page through rows, and edit a row through fields
//! that follow the column types.
//!
//! - Every row is addressed by its `rowid` (every Turso table is a rowid
//!   table), the way DB Browser for `SQLite` addresses rows.
//! - Every change is checked here, against the table's own columns, before
//!   it is written: unknown tables or columns, an empty value in a required
//!   column, and a value that does not fit the column's type are refused with
//!   an error that names the column.
//! - Table and column names are only used after they are found in the
//!   catalog, and always quoted; values are always bound, never spliced.

use anyhow::{Context, Result, bail};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue};
use serde::{Deserialize, Serialize};
use specta::Type;

/// Tables the editor never lists: `SQLite`'s own catalog and the migration
/// history (shown read-only by the devtool, written only by [`super::migrate`]).
const HIDDEN_TABLES: &[&str] = &["schema_migrations"];

/// Largest page of rows one read returns.
pub const MAX_PAGE: u32 = 500;

/// How a column stores values — `SQLite`'s type affinity, derived from the
/// declared type by the rules in <https://sqlite.org/datatype3.html> §3.1.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum Affinity {
    /// Whole numbers (`INTEGER`, `INT`, `BIGINT`, …).
    Integer,
    /// Text (`TEXT`, `VARCHAR`, `CLOB`, …).
    Text,
    /// Declared without a type, or `BLOB`: stores any value as given.
    Blob,
    /// Decimal numbers (`REAL`, `DOUBLE`, `FLOAT`).
    Real,
    /// Numbers of either kind (`NUMERIC`, `DECIMAL`, `BOOLEAN`, `DATE`, …).
    Numeric,
}

impl Affinity {
    /// The affinity `SQLite` gives a declared column type.
    #[must_use]
    pub fn of(declared_type: &str) -> Self {
        let t = declared_type.to_ascii_uppercase();
        if t.contains("INT") {
            Self::Integer
        } else if t.contains("CHAR") || t.contains("CLOB") || t.contains("TEXT") {
            Self::Text
        } else if t.is_empty() || t.contains("BLOB") {
            Self::Blob
        } else if t.contains("REAL") || t.contains("FLOA") || t.contains("DOUB") {
            Self::Real
        } else {
            Self::Numeric
        }
    }
}

/// One column of a table, as `PRAGMA table_info` describes it.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    /// Column name.
    pub name: String,
    /// The type as written in `CREATE TABLE` (may be empty).
    pub declared_type: String,
    /// How the column stores values.
    pub affinity: Affinity,
    /// Whether the column may be empty (NULL).
    pub nullable: bool,
    /// The default, as SQL text, when the column has one.
    pub default_value: Option<String>,
    /// Whether the column is part of the primary key.
    pub primary_key: bool,
}

/// A table and how many rows it holds.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TableSummary {
    /// Table name.
    pub name: String,
    /// Number of rows.
    pub row_count: i64,
    /// Number of columns.
    pub column_count: u32,
}

/// One cell value as the devtool shows and edits it.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(tag = "kind", content = "value", rename_all = "camelCase")]
pub enum Cell {
    /// Empty (NULL).
    Null,
    /// A whole number.
    Integer(i64),
    /// A decimal number.
    Real(f64),
    /// Text.
    Text(String),
    /// Binary data, shown as its size in bytes; not editable here.
    Blob(u64),
}

impl From<SqlValue> for Cell {
    fn from(v: SqlValue) -> Self {
        match v {
            SqlValue::Null => Self::Null,
            SqlValue::Integer(i) => Self::Integer(i),
            SqlValue::Real(f) => Self::Real(f),
            SqlValue::Text(t) => Self::Text(t),
            SqlValue::Blob(b) => Self::Blob(b.len() as u64),
        }
    }
}

/// One row: its `rowid` and a cell per column, in column order.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Row {
    /// The row's `rowid` — how edits address it.
    pub rowid: i64,
    /// One cell per column of the table, in column order.
    pub cells: Vec<Cell>,
}

/// A page of a table's rows, with the columns that describe them.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RowPage {
    /// The table.
    pub table: String,
    /// The table's columns, in order.
    pub columns: Vec<Column>,
    /// The rows on this page, in `rowid` order.
    pub rows: Vec<Row>,
    /// Rows in the whole table.
    pub total: i64,
    /// Index of the first row on this page.
    pub offset: u32,
}

/// One column's new value in an insert or update.
#[derive(Debug, Clone, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CellChange {
    /// Column name.
    pub column: String,
    /// The new value.
    pub value: Cell,
}

/// The result of a statement typed into the SQL console.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SqlOutcome {
    /// Rows returned (statements that read).
    pub rows: Vec<Vec<Cell>>,
    /// Rows changed (statements that write).
    pub rows_affected: u64,
}

/// Quote an identifier for SQL (`"name"`, inner quotes doubled).
fn quote(ident: &str) -> String {
    format!("\"{}\"", ident.replace('"', "\"\""))
}

/// The tables in the database, with row and column counts, by name.
///
/// # Errors
/// Returns an error if the catalog or a count cannot be read.
pub async fn tables(adapter: &dyn SqlAdapter) -> Result<Vec<TableSummary>> {
    let mut out = Vec::new();
    for name in table_names(adapter).await? {
        let row_count = count(adapter, &name).await?;
        let column_count = u32::try_from(columns_of(adapter, &name).await?.len())
            .context("column count out of range")?;
        out.push(TableSummary {
            name,
            row_count,
            column_count,
        });
    }
    Ok(out)
}

/// One page of a table's rows (`limit` is capped at [`MAX_PAGE`]).
///
/// # Errors
/// Returns an error if the table is unknown or cannot be read.
pub async fn rows(
    adapter: &dyn SqlAdapter,
    table: &str,
    offset: u32,
    limit: u32,
) -> Result<RowPage> {
    let columns = columns(adapter, table).await?;
    let list = columns
        .iter()
        .map(|c| quote(&c.name))
        .collect::<Vec<_>>()
        .join(", ");
    let sql = format!(
        "SELECT rowid, {list} FROM {} ORDER BY rowid LIMIT ? OFFSET ?",
        quote(table)
    );
    let found = adapter
        .query(&sql, &[limit.min(MAX_PAGE).into(), offset.into()])
        .await
        .with_context(|| format!("read rows of {table}"))?;
    let rows = found
        .into_iter()
        .map(|values| to_row(table, values))
        .collect::<Result<Vec<_>>>()?;
    Ok(RowPage {
        table: table.to_owned(),
        total: count(adapter, table).await?,
        columns,
        rows,
        offset,
    })
}

/// Change some columns of one row, then read the row back.
///
/// # Errors
/// Returns an error if the table, a column or the row is unknown, or a
/// value does not fit its column.
pub async fn update_row(
    adapter: &dyn SqlAdapter,
    table: &str,
    rowid: i64,
    changes: &[CellChange],
) -> Result<Row> {
    if changes.is_empty() {
        bail!("nothing to change in {table}");
    }
    let columns = columns(adapter, table).await?;
    let mut sets = Vec::with_capacity(changes.len());
    let mut values = Vec::with_capacity(changes.len() + 1);
    for change in changes {
        let column = find(&columns, table, &change.column)?;
        sets.push(format!("{} = ?", quote(&column.name)));
        values.push(check(table, column, &change.value)?);
    }
    values.push(rowid.into());
    let sql = format!(
        "UPDATE {} SET {} WHERE rowid = ?",
        quote(table),
        sets.join(", ")
    );
    let updated = adapter
        .execute(&sql, &values)
        .await
        .with_context(|| format!("update row {rowid} of {table}"))?;
    if updated == 0 {
        bail!("{table} has no row {rowid} — it may have been deleted");
    }
    read_row(adapter, table, &columns, rowid).await
}

/// Add a row. Columns left out take their defaults.
///
/// # Errors
/// Returns an error if the table or a column is unknown, a value does not
/// fit its column, or a required column without a default is left out.
pub async fn insert_row(
    adapter: &dyn SqlAdapter,
    table: &str,
    values: &[CellChange],
) -> Result<Row> {
    let columns = columns(adapter, table).await?;
    for column in &columns {
        let given = values.iter().any(|v| v.column == column.name);
        if !given
            && !column.nullable
            && column.default_value.is_none()
            && !is_rowid_alias(column, &columns)
        {
            bail!("{table}.{} is required", column.name);
        }
    }
    let mut names = Vec::with_capacity(values.len());
    let mut bound = Vec::with_capacity(values.len());
    for change in values {
        let column = find(&columns, table, &change.column)?;
        names.push(quote(&column.name));
        bound.push(check(table, column, &change.value)?);
    }
    let sql = if names.is_empty() {
        format!(
            "INSERT INTO {} DEFAULT VALUES RETURNING rowid",
            quote(table)
        )
    } else {
        format!(
            "INSERT INTO {} ({}) VALUES ({}) RETURNING rowid",
            quote(table),
            names.join(", "),
            vec!["?"; names.len()].join(", ")
        )
    };
    let inserted = adapter
        .query(&sql, &bound)
        .await
        .with_context(|| format!("add a row to {table}"))?;
    let rowid = inserted
        .first()
        .and_then(|r| r.first())
        .and_then(SqlValue::as_integer)
        .with_context(|| format!("{table}: insert returned no rowid"))?;
    read_row(adapter, table, &columns, rowid).await
}

/// Delete one row.
///
/// # Errors
/// Returns an error if the table or the row is unknown.
pub async fn delete_row(adapter: &dyn SqlAdapter, table: &str, rowid: i64) -> Result<()> {
    known_table(adapter, table).await?;
    let sql = format!("DELETE FROM {} WHERE rowid = ?", quote(table));
    let deleted = adapter
        .execute(&sql, &[rowid.into()])
        .await
        .with_context(|| format!("delete row {rowid} of {table}"))?;
    if deleted == 0 {
        bail!("{table} has no row {rowid} — it may already be deleted");
    }
    Ok(())
}

/// Run one statement typed into the SQL console. Statements that read
/// (`SELECT`, `WITH`, `PRAGMA`, `EXPLAIN`, `VALUES`) return rows; the rest
/// return how many rows they changed.
///
/// # Errors
/// Returns the database's error for the statement.
pub async fn run_sql(adapter: &dyn SqlAdapter, sql: &str) -> Result<SqlOutcome> {
    let sql = sql.trim();
    if sql.is_empty() {
        bail!("type a statement to run");
    }
    let first = sql
        .split_whitespace()
        .next()
        .unwrap_or_default()
        .to_ascii_uppercase();
    if matches!(
        first.as_str(),
        "SELECT" | "WITH" | "PRAGMA" | "EXPLAIN" | "VALUES"
    ) {
        let rows = adapter.query(sql, &[]).await?;
        Ok(SqlOutcome {
            rows: rows
                .into_iter()
                .map(|r| r.into_iter().map(Cell::from).collect())
                .collect(),
            rows_affected: 0,
        })
    } else {
        Ok(SqlOutcome {
            rows: Vec::new(),
            rows_affected: adapter.execute(sql, &[]).await?,
        })
    }
}

/// The columns of a known table.
///
/// # Errors
/// Returns an error if the table is unknown or its columns cannot be read.
pub async fn columns(adapter: &dyn SqlAdapter, table: &str) -> Result<Vec<Column>> {
    known_table(adapter, table).await?;
    columns_of(adapter, table).await
}

async fn table_names(adapter: &dyn SqlAdapter) -> Result<Vec<String>> {
    let rows = adapter
        .query(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
            &[],
        )
        .await
        .context("read the table catalog")?;
    Ok(rows
        .into_iter()
        .filter_map(|r| r.into_iter().next())
        .filter_map(|v| match v {
            SqlValue::Text(name) if !HIDDEN_TABLES.contains(&name.as_str()) => Some(name),
            _ => None,
        })
        .collect())
}

async fn known_table(adapter: &dyn SqlAdapter, table: &str) -> Result<()> {
    if table_names(adapter).await?.iter().any(|t| t == table) {
        Ok(())
    } else {
        bail!("there is no table named {table:?}")
    }
}

async fn columns_of(adapter: &dyn SqlAdapter, table: &str) -> Result<Vec<Column>> {
    let rows = adapter
        .query(&format!("PRAGMA table_info({})", quote(table)), &[])
        .await
        .with_context(|| format!("read the columns of {table}"))?;
    rows.into_iter()
        .map(|row| match row.as_slice() {
            // cid, name, type, notnull, dflt_value, pk
            [
                _,
                SqlValue::Text(name),
                declared,
                SqlValue::Integer(notnull),
                default,
                SqlValue::Integer(pk),
            ] => {
                let declared_type = declared.as_text().unwrap_or_default().to_owned();
                Ok(Column {
                    name: name.clone(),
                    affinity: Affinity::of(&declared_type),
                    declared_type,
                    nullable: *notnull == 0,
                    default_value: default.as_text().map(str::to_owned),
                    primary_key: *pk > 0,
                })
            }
            other => bail!("unexpected column description for {table}: {other:?}"),
        })
        .collect()
}

async fn count(adapter: &dyn SqlAdapter, table: &str) -> Result<i64> {
    let rows = adapter
        .query(&format!("SELECT count(*) FROM {}", quote(table)), &[])
        .await
        .with_context(|| format!("count the rows of {table}"))?;
    rows.first()
        .and_then(|r| r.first())
        .and_then(SqlValue::as_integer)
        .with_context(|| format!("count of {table} returned no number"))
}

async fn read_row(
    adapter: &dyn SqlAdapter,
    table: &str,
    columns: &[Column],
    rowid: i64,
) -> Result<Row> {
    let list = columns
        .iter()
        .map(|c| quote(&c.name))
        .collect::<Vec<_>>()
        .join(", ");
    let sql = format!("SELECT rowid, {list} FROM {} WHERE rowid = ?", quote(table));
    let found = adapter
        .query(&sql, &[rowid.into()])
        .await
        .with_context(|| format!("read row {rowid} of {table}"))?;
    let values = found
        .into_iter()
        .next()
        .with_context(|| format!("{table} has no row {rowid}"))?;
    to_row(table, values)
}

fn to_row(table: &str, values: Vec<SqlValue>) -> Result<Row> {
    let mut values = values.into_iter();
    let rowid = values
        .next()
        .and_then(|v| v.as_integer())
        .with_context(|| format!("{table}: row without a rowid"))?;
    Ok(Row {
        rowid,
        cells: values.map(Cell::from).collect(),
    })
}

fn find<'a>(columns: &'a [Column], table: &str, name: &str) -> Result<&'a Column> {
    columns
        .iter()
        .find(|c| c.name == name)
        .with_context(|| format!("{table} has no column {name:?}"))
}

/// An `INTEGER PRIMARY KEY` column is the rowid: leaving it out assigns one.
fn is_rowid_alias(column: &Column, columns: &[Column]) -> bool {
    column.primary_key
        && column.declared_type.eq_ignore_ascii_case("INTEGER")
        && columns.iter().filter(|c| c.primary_key).count() == 1
}

/// Check a value against its column and turn it into a bind value.
fn check(table: &str, column: &Column, value: &Cell) -> Result<SqlValue> {
    let at = || format!("{table}.{}", column.name);
    Ok(match (column.affinity, value) {
        (_, Cell::Null) if !column.nullable => bail!("{} can't be empty", at()),
        (_, Cell::Null) => SqlValue::Null,
        (_, Cell::Blob(_)) => bail!("{} holds binary data, which can't be edited here", at()),
        (Affinity::Real, Cell::Integer(i)) =>
        {
            #[allow(
                clippy::cast_precision_loss,
                reason = "a whole number stored as a decimal, as SQLite itself does"
            )]
            SqlValue::Real(*i as f64)
        }
        (Affinity::Integer | Affinity::Numeric | Affinity::Blob, Cell::Integer(i)) => {
            SqlValue::Integer(*i)
        }
        (Affinity::Real | Affinity::Numeric | Affinity::Blob, Cell::Real(f)) => SqlValue::Real(*f),
        (Affinity::Text | Affinity::Blob, Cell::Text(t)) => SqlValue::Text(t.clone()),
        (Affinity::Integer, _) => bail!("{} takes a whole number", at()),
        (Affinity::Real | Affinity::Numeric, _) => bail!("{} takes a number", at()),
        (Affinity::Text, _) => bail!("{} takes text", at()),
    })
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use devpulse_clyffy::cortex::persistence::{TursoAdapter, TursoOptions};

    const SCHEMA: &str = "
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            display_name TEXT,
            expertise_level INTEGER,
            temperature REAL NOT NULL DEFAULT 0.7,
            note
        );
        CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, label TEXT NOT NULL);
    ";

    async fn open(tag: &str) -> (TursoAdapter, std::path::PathBuf) {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos());
        let dir = std::env::temp_dir().join(format!("devpulse-editor-{tag}-{nanos}"));
        let adapter =
            TursoAdapter::open_with_schema(&dir.join("t.db"), SCHEMA, TursoOptions::default())
                .await
                .expect("open");
        super::super::migrate(&adapter, &[])
            .await
            .expect("history table");
        (adapter, dir)
    }

    async fn done(adapter: TursoAdapter, dir: std::path::PathBuf) {
        adapter.close().await;
        drop(adapter);
        let _ = std::fs::remove_dir_all(dir);
    }

    fn change(column: &str, value: Cell) -> CellChange {
        CellChange {
            column: column.into(),
            value,
        }
    }

    #[test]
    fn affinity_follows_sqlite_rules() {
        assert_eq!(Affinity::of("INTEGER"), Affinity::Integer);
        assert_eq!(Affinity::of("bigint"), Affinity::Integer);
        assert_eq!(Affinity::of("VARCHAR(40)"), Affinity::Text);
        assert_eq!(Affinity::of(""), Affinity::Blob);
        assert_eq!(Affinity::of("DOUBLE"), Affinity::Real);
        assert_eq!(Affinity::of("BOOLEAN"), Affinity::Numeric);
    }

    #[tokio::test]
    async fn lists_tables_and_columns_but_not_migration_history() {
        let (adapter, dir) = open("tables").await;
        let names: Vec<_> = tables(&adapter)
            .await
            .expect("tables")
            .into_iter()
            .map(|t| t.name)
            .collect();
        assert_eq!(names, ["items", "profiles"]);

        let cols = columns(&adapter, "profiles").await.expect("columns");
        let temp = cols
            .iter()
            .find(|c| c.name == "temperature")
            .expect("temperature");
        assert_eq!(temp.affinity, Affinity::Real);
        assert!(!temp.nullable);
        assert_eq!(temp.default_value.as_deref(), Some("0.7"));
        assert!(
            cols.iter()
                .find(|c| c.name == "id")
                .expect("id")
                .primary_key
        );
        assert_eq!(
            cols.iter()
                .find(|c| c.name == "note")
                .expect("note")
                .affinity,
            Affinity::Blob
        );

        assert!(columns(&adapter, "schema_migrations").await.is_err());
        assert!(
            columns(&adapter, "nope\"; DROP TABLE items; --")
                .await
                .is_err()
        );
        done(adapter, dir).await;
    }

    #[tokio::test]
    async fn insert_update_delete_round_trip() {
        let (adapter, dir) = open("edit").await;
        let row = insert_row(
            &adapter,
            "profiles",
            &[
                change("id", Cell::Text("user-1".into())),
                change("expertise_level", Cell::Integer(1)),
            ],
        )
        .await
        .expect("insert");
        // id, display_name, expertise_level, temperature (default), note
        assert_eq!(
            row.cells,
            [
                Cell::Text("user-1".into()),
                Cell::Null,
                Cell::Integer(1),
                Cell::Real(0.7),
                Cell::Null
            ]
        );

        let row = update_row(
            &adapter,
            "profiles",
            row.rowid,
            &[
                change("display_name", Cell::Text("Ada".into())),
                change("expertise_level", Cell::Null),
            ],
        )
        .await
        .expect("update");
        assert_eq!(row.cells[1], Cell::Text("Ada".into()));
        assert_eq!(row.cells[2], Cell::Null);

        let page = rows(&adapter, "profiles", 0, 50).await.expect("rows");
        assert_eq!(page.total, 1);
        assert_eq!(page.rows[0].cells, row.cells);

        delete_row(&adapter, "profiles", row.rowid)
            .await
            .expect("delete");
        assert!(delete_row(&adapter, "profiles", row.rowid).await.is_err());
        assert_eq!(
            rows(&adapter, "profiles", 0, 50).await.expect("rows").total,
            0
        );
        done(adapter, dir).await;
    }

    #[tokio::test]
    async fn refuses_values_that_do_not_fit_their_column() {
        let (adapter, dir) = open("check").await;
        let row = insert_row(
            &adapter,
            "items",
            &[change("label", Cell::Text("one".into()))],
        )
        .await
        .expect("insert assigns the integer key");

        let wrong_type = update_row(
            &adapter,
            "items",
            row.rowid,
            &[change("id", Cell::Text("x".into()))],
        )
        .await;
        assert!(format!("{:#}", wrong_type.unwrap_err()).contains("items.id takes a whole number"));

        let empty = update_row(&adapter, "items", row.rowid, &[change("label", Cell::Null)]).await;
        assert!(format!("{:#}", empty.unwrap_err()).contains("items.label can't be empty"));

        let unknown = update_row(&adapter, "items", row.rowid, &[change("nope", Cell::Null)]).await;
        assert!(format!("{:#}", unknown.unwrap_err()).contains("no column"));

        let missing = insert_row(&adapter, "items", &[]).await;
        assert!(format!("{:#}", missing.unwrap_err()).contains("items.label is required"));

        let gone = update_row(
            &adapter,
            "items",
            999,
            &[change("label", Cell::Text("x".into()))],
        )
        .await;
        assert!(format!("{:#}", gone.unwrap_err()).contains("no row 999"));
        done(adapter, dir).await;
    }

    #[tokio::test]
    async fn console_reads_and_writes() {
        let (adapter, dir) = open("console").await;
        let wrote = run_sql(&adapter, "INSERT INTO items (label) VALUES ('a'), ('b')")
            .await
            .expect("insert");
        assert_eq!(wrote.rows_affected, 2);
        let read = run_sql(&adapter, "  select count(*) from items")
            .await
            .expect("select");
        assert_eq!(read.rows, vec![vec![Cell::Integer(2)]]);
        assert!(run_sql(&adapter, "SELEC nonsense").await.is_err());
        done(adapter, dir).await;
    }
}
