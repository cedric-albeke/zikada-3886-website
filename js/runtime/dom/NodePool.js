// NodePool: preallocate and reuse nodes with a hard cap
export function createNodePool(factory, limit, container){
  const free = [];
  const used = new Set();
  for (let i=0;i<limit;i++){ const n = factory(); n.style.display='none'; free.push(n); if (container) container.appendChild(n); }
  function acquire(){ if (free.length===0) return null; const n = free.pop(); used.add(n); n.style.display=''; return n; }
  function release(n){ if (!used.has(n)) return; used.delete(n); n.style.display='none'; free.push(n); }
  function inUseCount(){ return used.size; }
  return { acquire, release, inUseCount };
}