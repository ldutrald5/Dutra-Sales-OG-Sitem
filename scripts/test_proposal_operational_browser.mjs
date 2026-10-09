// Uses only an isolated loopback server, random test credentials and fictional CRM data.
process.env.OG_DOCUMENT_THEME='impacto-og';
process.env.OG_DOCUMENT_AUTH_ACCEPTANCE='1';
await import('./test_proposal_document_browser.mjs');
