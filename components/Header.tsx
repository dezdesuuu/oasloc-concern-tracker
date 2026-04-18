import { logoutAction } from '@/app/login/actions'

export function Header() {
  return (
    <header className="bg-slate-800 text-white shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div>
          <span className="font-bold text-base tracking-tight">OASLOC</span>
          <span className="ml-2 text-slate-400 text-sm">Concern Tracker</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-slate-300 hover:text-white hover:underline"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  )
}
