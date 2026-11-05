
import React from 'react';
import { TRANSPORT_HTML } from '../content/sections';

export default function TransportPage() {
  return <div dangerouslySetInnerHTML={{ __html: TRANSPORT_HTML }} />;
}
