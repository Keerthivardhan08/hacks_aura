import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect visitors from the root URL to the login page
  redirect('/login');
}
