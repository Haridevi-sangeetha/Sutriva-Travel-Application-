
import React from 'react';
import { MAP_HTML } from '../content/sections';

export default function MapPage() {
  return <div dangerouslySetInnerHTML={{ __html: MAP_HTML }} />;
}
