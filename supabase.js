(function(){
 const configured=window.QB_CONFIG && !window.QB_CONFIG.supabaseUrl.startsWith('YOUR_') && !window.QB_CONFIG.supabaseAnonKey.startsWith('YOUR_');
 window.QB_DB = configured ? window.supabase.createClient(QB_CONFIG.supabaseUrl,QB_CONFIG.supabaseAnonKey) : null;
 window.qbAuthRequired=async function(){if(!QB_DB){location.href='login.html';return null}const {data}=await QB_DB.auth.getSession();if(!data.session){location.href='login.html';return null}return data.session};
 window.qbLogout=async function(){if(QB_DB) await QB_DB.auth.signOut();location.href='login.html'};
})();
