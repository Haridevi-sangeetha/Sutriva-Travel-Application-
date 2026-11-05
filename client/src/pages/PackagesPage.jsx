
import React from 'react';
import { PACKAGES_HTML } from '../content/sections';

export default function PackagesPage() {
  return <div dangerouslySetInnerHTML={{ __html: PACKAGES_HTML }} />;
}
