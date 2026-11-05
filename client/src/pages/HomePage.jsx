
import React from 'react';
import { HOME_HTML } from '../content/sections';

export default function HomePage() {
  return <div dangerouslySetInnerHTML={{ __html: HOME_HTML }} />;
}
