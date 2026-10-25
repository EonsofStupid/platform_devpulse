use crate::cortex::traits::security::IdentityProvider;

pub struct BufferAdapter;

impl IdentityProvider for BufferAdapter {
    fn verify(&self, _token: &str) -> Result<bool, String> {
        Ok(true) // Stub
    }
}
