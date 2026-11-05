
import React from 'react';
import { NAVBAR_HTML } from '../../content/sections';

export default function Navbar() {
  return <div dangerouslySetInnerHTML={{ __html: NAVBAR_HTML }} />;
}
