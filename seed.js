const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://iwjnbreeazxvbzxelnzj.supabase.co',
  'sb_publishable_SMYJrdhxWSvxBnDkGGtHFA_yZbrb_Sn'
);

// We need to parse the ts file to get the data.
// A simple way is to use ts-node or just compile it in memory, 
// but we can also just run it via ts-node!
