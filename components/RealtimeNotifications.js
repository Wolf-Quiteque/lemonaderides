'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RealtimeNotifications() {
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let userId = null;

    async function init() {
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id || null;

      const channel = supabase
        .channel('public:notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const row = payload.new;
          if (!userId || row.user_id !== userId) return;
          setItems((prev) => [{ id: row.id, title: row.title, message: row.message, created_at: row.created_at }, ...prev].slice(0, 5));
        })
        .subscribe();

      // optional: preload last few notifications
      const { data: existing } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setItems((existing || []).map(n => ({ id: n.id, title: n.title, message: n.message, created_at: n.created_at })));

      return () => { supabase.removeChannel(channel); };
    }

    const cleanupPromise = init();
    return () => { cleanupPromise.then(clean => typeof clean === 'function' && clean()); };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {items.map(it => (
        <div key={it.id} className="bg-black text-white p-3 rounded shadow-lg w-80">
          <div className="flex justify-between items-center">
            <strong className="text-sm">{it.title}</strong>
            <button className="text-xs opacity-75 hover:opacity-100" onClick={()=>setVisible(false)}>x</button>
          </div>
          <p className="text-xs mt-1">{it.message}</p>
          <p className="text-[10px] opacity-70 mt-1">{new Date(it.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
