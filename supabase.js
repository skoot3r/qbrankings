(function(){
  function isConfigured(){
    return !!(window.QB_CONFIG &&
      typeof window.QB_CONFIG.supabaseUrl === 'string' &&
      typeof window.QB_CONFIG.supabaseAnonKey === 'string' &&
      !window.QB_CONFIG.supabaseUrl.startsWith('YOUR_') &&
      !window.QB_CONFIG.supabaseAnonKey.startsWith('YOUR_'));
  }

  window.QB_DB = null;

  try {
    if(isConfigured() && window.supabase && typeof window.supabase.createClient === 'function') {
      window.QB_DB = window.supabase.createClient(
        window.QB_CONFIG.supabaseUrl,
        window.QB_CONFIG.supabaseAnonKey
      );
    }
  } catch(err) {
    console.error('Supabase client initialization failed:', err);
    window.QB_DB = null;
  }

  window.qbAuthRequired = async function(){
    if(!window.QB_DB){
      window.location.replace('login.html?error=connection');
      return null;
    }
    try {
      const { data, error } = await window.QB_DB.auth.getSession();
      if(error) throw error;
      if(!data || !data.session){
        window.location.replace('login.html');
        return null;
      }
      return data.session;
    } catch(err) {
      console.error('Auth check failed:', err);
      window.location.replace('login.html?error=auth');
      return null;
    }
  };

  window.qbLogout = async function(){
    const button = document.getElementById('logout');
    if(button) { button.disabled = true; button.textContent = 'Logging out…'; }

    try {
      if(!window.QB_DB) throw new Error('Supabase is not connected.');
      const { error } = await window.QB_DB.auth.signOut({ scope: 'local' });
      if(error) throw error;
      window.location.replace('login.html?loggedout=1');
    } catch(err) {
      console.error('Logout failed:', err);
      if(button) { button.disabled = false; button.textContent = 'Log out'; }
      alert('Logout failed: ' + (err && err.message ? err.message : String(err)));
    }
  };
})();
