(function(){
  const msg=document.getElementById('loginMessage');
  const form=document.getElementById('loginForm');
  const emailInput=document.getElementById('email');
  const passwordInput=document.getElementById('password');

  function configured(){
    return !!(window.QB_CONFIG &&
      typeof window.QB_CONFIG.supabaseUrl==='string' &&
      typeof window.QB_CONFIG.supabaseAnonKey==='string' &&
      window.QB_CONFIG.supabaseUrl.startsWith('https://') &&
      !window.QB_CONFIG.supabaseUrl.startsWith('https://YOUR_') &&
      !window.QB_CONFIG.supabaseAnonKey.startsWith('YOUR_'));
  }

  if(!configured() || !window.supabase || typeof window.supabase.createClient!=='function'){
    msg.textContent='Secure login is not connected. Check the site configuration.';
    return;
  }

  const client=window.supabase.createClient(QB_CONFIG.supabaseUrl,QB_CONFIG.supabaseAnonKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });

  const params=new URLSearchParams(location.search);
  if(params.get('loggedout')==='1') msg.textContent='You have been logged out.';
  else if(params.get('error')) msg.textContent='Please sign in to access the private editor.';

  // If an active session already exists, skip the login form.
  client.auth.getSession().then(({data})=>{
    if(data && data.session) location.replace('admin.html');
  });

  form.onsubmit=async e=>{
    e.preventDefault();
    const email=emailInput.value.trim();
    const password=passwordInput.value;
    if(!email || !password) return;
    const button=form.querySelector('button[type="submit"]');
    if(button){button.disabled=true;button.textContent='Signing in…';}
    msg.textContent='';

    try{
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error) throw error;
      if(!data || !data.session) throw new Error('Login succeeded, but no session was returned.');
      location.replace('admin.html');
    }catch(error){
      console.error('Login failed:',error);
      msg.textContent=error && error.message ? error.message : 'Unable to sign in.';
      if(button){button.disabled=false;button.textContent='Sign in';}
    }
  };
})();
