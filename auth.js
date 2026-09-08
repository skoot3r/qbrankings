(function(){
  const msg=document.getElementById('loginMessage');
  const form=document.getElementById('loginForm');
  const emailInput=document.getElementById('email');
  const passwordInput=document.getElementById('password');
  const configured=window.QB_CONFIG && !window.QB_CONFIG.supabaseUrl.startsWith('YOUR_') && !window.QB_CONFIG.supabaseAnonKey.startsWith('YOUR_');

  if(!configured || !window.supabase || typeof window.supabase.createClient !== 'function'){
    msg.textContent='Secure login is not available right now.';
    return;
  }

  const client=window.supabase.createClient(QB_CONFIG.supabaseUrl,QB_CONFIG.supabaseAnonKey);

  const params=new URLSearchParams(location.search);
  if(params.get('loggedout')==='1') msg.textContent='You have been logged out.';
  if(params.get('error')) msg.textContent='Please sign in to access the private editor.';

  form.onsubmit=async e=>{
    e.preventDefault();
    msg.textContent='Signing in…';
    const {error}=await client.auth.signInWithPassword({email:emailInput.value.trim(),password:passwordInput.value});
    if(error){msg.textContent=error.message;return;}
    location.replace('admin.html');
  };
})();
