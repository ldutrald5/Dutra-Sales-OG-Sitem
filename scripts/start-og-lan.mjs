if(!process.env.OG_LOCAL_ACCESS_TOKEN||process.env.OG_LOCAL_ACCESS_TOKEN.length<16){
  console.error('Defina OG_LOCAL_ACCESS_TOKEN com pelo menos 16 caracteres antes de iniciar o acesso pela rede.');
  process.exit(1);
}
process.env.OG_HOST=process.env.OG_HOST||'0.0.0.0';
await import('../apps/sistema-og/server.mjs');
