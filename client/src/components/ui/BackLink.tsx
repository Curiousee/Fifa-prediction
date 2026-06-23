import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
  to: string;
  label?: string;
}

const BackLink: React.FC<BackLinkProps> = ({ to, label = 'Back' }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
  >
    <ArrowLeft size={16} />
    {label}
  </Link>
);

export default BackLink;
