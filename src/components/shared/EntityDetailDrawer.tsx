/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EntityDetailDrawer — cross-module drill-down.
 *
 * Given any entity (invoice, customer, shift, tank, nozzle, product, ...)
 * it renders the connected Business Graph trail so the user can navigate:
 *
 * Invoice → Customer → Ledger → Payment → Journal → Audit →
 * Roznamcha → Shift → Tank → Nozzle → Product
 *
 * Without ever losing context.
 */

import React, { useMemo, useState } from 'react';
import { X, ArrowRight, Boxes, Link2, Network, ArrowUpRight } from 'lucide-react';
import { EntityRef, GraphNode, GraphNodeKind } from '../../types/search.types';
import { useBusinessGraph } from '../../hooks/useBusinessGraph';
import { db } from '../../data/db';
import { formatCurrency } from '../../lib/currency';

const KIND_ICON: Record<GraphNodeKind, React.ReactNode> = {
 customer: '👤', supplier: '🚚', shift: '🕑', product: '🛢️', tank: '🛢', nozzle: '⛽',
 invoice: '🧾', payment: '💵', expense: '🧾', ledger: '📒', journal: '📓', audit: '🔍', roznamcha: '📜', staff: '🧑', batch: '📦'
};

const KIND_COLOR: Record<GraphNodeKind, string> = {
 customer: 'border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-500/10',
 supplier: 'border-purple-500/30 text-purple-600 bg-purple-50 dark:bg-purple-500/10',
 shift: 'border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-500/10',
 product: 'border-teal-500/30 text-teal-600 bg-teal-50 dark:bg-teal-500/10',
 tank: 'border-cyan-500/30 text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10',
 nozzle: 'border-lime-500/30 text-lime-600 bg-lime-50 dark:bg-lime-500/10',
 invoice: 'border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
 payment: 'border-green-500/30 text-green-600 bg-green-50 dark:bg-green-500/10',
 expense: 'border-rose-500/30 text-rose-600 bg-rose-50 dark:bg-rose-500/10',
 ledger: 'border-indigo-500/30 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10',
 journal: 'border-slate-500/30 text-slate-600 bg-slate-50 /10',
 audit: 'border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-500/10',
 roznamcha: 'border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-500/10',
 staff: 'border-teal-500/30 text-teal-600 bg-teal-50 dark:bg-teal-500/10',
 batch: 'border-green-500/30 text-green-600 bg-green-50 dark:bg-green-500/10'
};

interface EntityDetailDrawerProps {
 entity: EntityRef;
 onClose: () => void;
 onNavigateModule: (viewId: string, contextData?: Record<string, any>) => void;
 /** when a linked node is selected, re-anchor the drawer to it */
 onReanchor: (ref: EntityRef) => void;
}

export default function EntityDetailDrawer({ entity, onClose, onNavigateModule, onReanchor }: EntityDetailDrawerProps) {
 const { graph, getTrail, getDegree } = useBusinessGraph();
 const [showGraph, setShowGraph] = useState(false);

 const trail = useMemo(() => getTrail(entity), [entity, getTrail]);
 const rootNode = trail[0];
 const linked = trail.slice(1);

 const degree = getDegree(entity);

 const kindLabel = (k: GraphNodeKind) => k.charAt(0).toUpperCase() + k.slice(1);

 return (
 <div className="fixed inset-0 z-[120] flex items-center justify-end">
 <div className="absolute inset-0 bg-card backdrop-blur-sm animate-fade-in" onClick={onClose} />
 <div className="relative w-full max-w-md h-screen flex flex-col bg-card border-l border-border shadow-2xl animate-slide-in">
 {/* Header */}
 <div className="h-16 border-b border-border flex items-center justify-between px-5 bg-subtle">
 <div className="flex items-center gap-2">
 <Network className="w-5 h-5 text-orange-600" />
 <div>
 <h3 className="font-black text-sm text-foreground capitalize leading-tight">{rootNode ? rootNode.label : entity.id}</h3>
 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{rootNode ? kindLabel(rootNode.kind) : entity.kind} • {degree} linked</span>
 </div>
 </div>
 <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-card/10 text-muted-foreground cursor-pointer">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-5 space-y-5">
 {/* Root entity summary */}
 {rootNode && (
 <div className={`rounded-xl border p-4${KIND_COLOR[rootNode.kind]}`}>
 <div className="flex items-center justify-between">
 <span className="text-2xl">{KIND_ICON[rootNode.kind]}</span>
 <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-card/60">{kindLabel(rootNode.kind)}</span>
 </div>
 <h4 className="font-black text-sm text-foreground mt-2">{rootNode.label}</h4>
 {rootNode.sublabel && <p className="text-xs text-muted-foreground mt-0.5">{rootNode.sublabel}</p>}
 {rootNode.meta && <p className="text-xs font-bold text-foreground mt-1">{rootNode.meta}</p>}
 <button
 onClick={() => onNavigateModule(rootNode.viewId, rootNode.contextData)}
 className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-card text-foreground text-xs font-bold py-2 hover:bg-slate-800 transition-colors cursor-pointer"
 >
 <ArrowUpRight className="w-3.5 h-3.5" /> {`Open in ${rootNode.viewId.replace(/_/g, ' ')}`}
 </button>
 </div>
 )}

 {/* Connected entities trail */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
 <Link2 className="w-3.5 h-3.5" /> Connected Records ({linked.length})
 </h5>
 <button onClick={() => setShowGraph(v => !v)} className="text-[10px] font-bold text-orange-600 hover:underline">{showGraph ? 'List' : 'Graph'}</button>
 </div>

 {showGraph ? (
 <BusinessGraphView nodes={trail} edges={graph.edges} rootId={rootNode?.id} onSelect={ref => onReanchor(ref)} />
 ) : (
 <div className="space-y-2">
 {linked.length === 0 && (
 <p className="text-xs text-muted-foreground italic text-center py-4">No linked records found in this station.</p>
 )}
 {linked.map(n => (
 <button
 key={n.id}
 onClick={() => onReanchor({ kind: n.kind as any, id: n.id.split(':')[1] })}
 className={`w-full text-left rounded-xl border p-3 flex items-center gap-3 transition-colors hover:shadow-sm${KIND_COLOR[n.kind]}`}
 >
 <span className="text-lg">{KIND_ICON[n.kind]}</span>
 <div className="flex-1 min-w-0">
 <div className="font-bold text-xs text-foreground truncate">{n.label}</div>
 <div className="text-[10px] text-muted-foreground truncate">{kindLabel(n.kind)} • {n.sublabel}</div>
 </div>
 <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}

function BusinessGraphView({ nodes, edges, rootId, onSelect }: { nodes: GraphNode[]; edges: any[]; rootId?: string; onSelect: (ref: EntityRef) => void }) {
 const isUrdu = false;
 return (
 <div className="rounded-xl border border-border p-4 bg-subtle space-y-3">
 {nodes.map((n, i) => {
 const rel = edges.find(e => (e.from === n.id && (rootId ? true : true)) || e.to === n.id);
 return (
 <div key={n.id} className="flex items-start gap-2">
 {i === 0 ? (
 <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
 ) : (
 <div className="flex flex-col items-center shrink-0 w-2">
 <span className="w-px h-3 bg-slate-300" />
 <span className="w-2 h-2 rounded-full bg-slate-400 mt-1" />
 </div>
 )}
 <button
 onClick={() => onSelect({ kind: n.kind as any, id: n.id.split(':')[1] })}
 className="flex-1 text-left rounded-lg border border-border bg-card px-3 py-2 hover:border-orange-500 transition-colors"
 >
 <div className="flex items-center justify-between">
 <span className="font-bold text-xs text-foreground">{n.label}</span>
 <span className="text-[9px] font-black uppercase text-muted-foreground">{n.kind}</span>
 </div>
 {n.sublabel && <div className="text-[10px] text-muted-foreground truncate">{n.sublabel}</div>}
 </button>
 </div>
 );
 })}
 <p className="text-[10px] text-muted-foreground pt-1">{!isUrdu ? 'Click any node to re-anchor the trail.' : ''}</p>
 </div>
 );
}
