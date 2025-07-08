import { RefreshCw, BarChart3, Hotel, Upload, PieChart, User, LogOut, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Header = ({ usuario, onLogout }) => {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const toggleMenu = () => {
    setMenuAberto(!menuAberto);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const links = [
    { path: '/', icon: <BarChart3 className="w-5 h-5" />, text: 'Dashboard' },
    { path: '/hotels', icon: <Hotel className="w-5 h-5" />, text: 'Hotéis' },
    { path: '/upload', icon: <Upload className="w-5 h-5" />, text: 'Upload' },
    { path: '/comparative', icon: <PieChart className="w-5 h-5" />, text: 'Comparativo' },
  ];

  // Adicionar link de administração para usuários master
  if (usuario && usuario.tipo === 'master') {
    links.push({ 
      path: '/admin/usuarios', 
      icon: <User className="w-5 h-5" />, 
      text: 'Usuários' 
    });
  }

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/images/logo.png" alt="O Sócio Hoteleiro" className="h-10 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rate Shopper</h1>
                <p className="text-sm text-gray-600">Sistema de Análise de Tarifas</p>
              </div>
            </Link>
          </div>

          {/* Menu para desktop */}
          <nav className="hidden md:flex space-x-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  location.pathname === link.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.icon}
                <span className="ml-1">{link.text}</span>
              </Link>
            ))}
          </nav>

          {/* Perfil do usuário */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <span className="mr-2">{usuario?.nome || 'Usuário'}</span>
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {usuario?.nome?.charAt(0) || 'U'}
              </div>
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg z-10">
                <div className="px-4 py-2 text-xs text-gray-500">
                  {usuario?.email}
                  <div className="mt-1">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {usuario?.tipo === 'master' ? 'Master' : usuario?.tipo === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Botão de menu para mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuAberto ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {menuAberto && (
          <div className="md:hidden py-3 border-t border-gray-200">
            <nav className="grid gap-2">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    location.pathname === link.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMenuAberto(false)}
                >
                  {link.icon}
                  <span className="ml-2">{link.text}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-2">Sair</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

