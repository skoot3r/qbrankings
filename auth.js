(function(){
 const configured=window.QB_CONFIG && !window.QB_CONFIG.supabaseUrl.startsWith('YOUR_') && !window.QB_CONFIG.supabaseAnonKey.startsWith('YOUR_');
 const msg=document.getElementById('loginMessage');
 if(!configured){msg.textContent='Connect Supabase in config.js to enable secure login.';return;}
 const client=window.supabase.createClient(QB_CONFIG.supabaseUrl,QB_CONFIG.supabaseAnonKey);
 document.getElementById('loginForm').onsubmit=async e=>{e.preventDefault();msg.textContent='Signing in…';const {error}=await client.auth.signInWithPassword({email:email.value,password:password.value});if(error){msg.textContent=error.message;return}location.href='admin.html'};
})();
