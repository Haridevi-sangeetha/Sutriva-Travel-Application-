
import React from 'react';
import { FOOTER_HTML } from '../../content/sections';

export default function Footer() {
  return <div dangerouslySetInnerHTML={{ __html: FOOTER_HTML }} />;
}
