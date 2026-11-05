
import React from 'react';
import { MODALS_HTML } from '../../content/sections';

export default function Modals() {
  return <div dangerouslySetInnerHTML={{ __html: MODALS_HTML }} />;
}
