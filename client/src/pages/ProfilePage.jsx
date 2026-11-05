
import React from 'react';
import { PROFILE_HTML } from '../content/sections';

export default function ProfilePage() {
  return <div dangerouslySetInnerHTML={{ __html: PROFILE_HTML }} />;
}
