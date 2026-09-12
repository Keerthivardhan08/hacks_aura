import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect visitors from the root URL to the dashboard
  redirect('/dashboard');
}
