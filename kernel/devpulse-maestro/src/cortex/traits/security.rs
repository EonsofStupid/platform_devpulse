/// The Identity Port (Contract)
pub trait IdentityProvider {
    fn verify(&self, token: &str) -> Result<bool, String>;
}
