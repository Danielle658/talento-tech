// Esta API Route não é mais utilizada e pode ser removida.
// A funcionalidade de redefinição de senha via frontend/Next.js API foi desabilitada.

export default async function handler(req, res) {
  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ message: `Funcionalidade desabilitada.` });
}