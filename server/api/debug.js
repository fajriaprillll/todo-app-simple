export default function handler(request, response) {
  response.status(200).json({
    body: 'Hello from pure JavaScript debug endpoint!',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    }
  });
}
