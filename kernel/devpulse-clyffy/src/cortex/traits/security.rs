/// The Identity Port (Contract)
pub trait IdentityProvider {
    /// Verify the given identity token and return whether it is valid.
    ///
    /// # Errors
    /// Returns an error if the provider cannot verify the supplied token.
    fn verify(&self, token: &str) -> Result<bool, String>;
}
