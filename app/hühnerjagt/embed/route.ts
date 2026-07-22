import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-static'

export async function GET() {
  const filePath = path.join(process.cwd(), 'app', 'hühnerjagt', 'index.html')
  const html = await readFile(filePath, 'utf8')

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}