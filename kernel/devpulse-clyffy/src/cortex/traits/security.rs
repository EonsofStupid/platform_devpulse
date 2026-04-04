/// The Identity Port (Contract)
pub trait IdentityProvider {
    /// Verify the given identity token and return whether it is valid.
    fn verify(&self, token: &str) -> Result<bool, String>;
}
