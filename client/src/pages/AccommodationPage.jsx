
import React from 'react';
import { ACCOMMODATION_HTML } from '../content/sections';

export default function AccommodationPage() {
  return <div dangerouslySetInnerHTML={{ __html: ACCOMMODATION_HTML }} />;
}
