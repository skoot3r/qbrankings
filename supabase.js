(function(){
  const configured = window.QB_CONFIG &&
    !window.QB_CONFIG.supabaseUrl.startsWith('YOUR_') &&
    !window.QB_CONFIG.supabaseAnonKey.startsWith('YOUR_');

  window.QB_DB = configured
    ? window.supabase.createClient(QB_CONFIG.supabaseUrl, QB_CONFIG.supabaseAnonKey)
    : null;

  window.qbAuthRequired = async function(){
    if(!QB_DB){
      window.location.replace('login.html');
      return null;
    }
    try {
      const { data, error } = await QB_DB.auth.getSession();
      if(error || !data.session){
        window.location.replace('login.html');
        return null;
      }
      return data.session;
    } catch(err) {
      console.error('Auth check failed:', err);
      window.location.replace('login.html');
      return null;
    }
  };

  window.qbLogout = async function(){
    const button = document.getElementById('logout');
    if(button) { button.disabled = true; button.textContent = 'Logging out…'; }

    try {
      if(!QB_DB){
        window.location.replace('login.html');
        return;
      }

      const { error } = await QB_DB.auth.signOut();
      if(error) throw error;

      // Verify the local session is actually gone before navigating away.
      const { data } = await QB_DB.auth.getSession();
      if(data && data.session){
        throw new Error('The session is still active. Please try again.');
      }

      window.location.replace('login.html?loggedout=1');
    } catch(err) {
      console.error('Logout failed:', err);
      if(button) { button.disabled = false; button.textContent = 'Log out'; }
      alert('Logout failed: ' + (err?.message || err));
    }
  };
})();
