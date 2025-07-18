
// Jednoduchý API endpoint pro kontrolu existence souborů
export default function handler(req, res) {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Chybí parametr path' });
  }
  
  // Pro git lock soubory vždy vracej false (neexistují)
  if (path.includes('.git') && path.includes('.lock')) {
    return res.status(404).json({ exists: false });
  }
  
  // Pro ostatní soubory vracej 200
  return res.status(200).json({ exists: true });
}
