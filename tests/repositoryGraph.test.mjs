import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFileMap, edgeCurvatures, directedLayout, pointFilters, traceDistances } from '../src/components/RepositoryIndex/repositoryGraph.ts';
import { dependencyLayout } from '../src/components/RepositoryIndex/repositoryLayout.ts';
const node = (id, path = `${id}.ts`) => ({ id, title: id, path, kind: 'function', group: 'src', branch: 'main' });
const edge = (source, target, kind = 'calls', id = `${source}-${target}-${kind}`) => ({ id, source, target, kind });

test('file projection preserves an entire chain, directions, bundles, and internal relations', () => {
  const graph = buildFileMap([node('a','a.ts'), node('a2','a.ts'), node('b'), node('c')], [edge('a','a2'), edge('a','b'), edge('a2','b'), edge('b','c'), edge('c','b')]);
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.internalRelations, 1);
  assert.equal(graph.edges.length, 3);
  assert.equal(graph.edges.find(e => e.source === 'file-map:a.ts').weight, 2);
  assert.deepEqual([...traceDistances(graph.nodes, graph.edges, 'file-map:a.ts', 2).values()], [0,1,2]);
});
test('unresolved endpoints are retained without inventing source files', () => {
  const graph = buildFileMap([node('a'), {...node('external',null),virtual:true}], [edge('a','external')]);
  assert.equal(graph.nodes.find(n => n.id === 'external').path, null);
  assert.equal(graph.edges[0].target, 'external');
});
test('tracing traverses incoming and outgoing edges, handles cycles and distinct components', () => {
  const nodes = ['a','b','c','d','other'].map(id => node(id));
  const edges = [edge('a','b'),edge('c','b'),edge('c','d'),edge('d','b')];
  assert.deepEqual([...traceDistances(nodes,edges,'a',1).keys()], ['a','b']);
  assert.deepEqual([...traceDistances(nodes,edges,'a',2).keys()], ['a','b','c','d']);
  assert.equal(traceDistances(nodes,edges,'a',999999).has('other'),false);
  assert.equal(traceDistances(nodes,edges,'missing',2).size,0);
});
test('directed layout follows chain direction and is deterministic', () => {
  const nodes = ['a','b','c'].map(id => node(id));
  const edges = [edge('a','b'),edge('b','c')];
  const first = directedLayout(nodes,edges);
  assert(first.get('a').x < first.get('b').x);
  assert(first.get('b').x < first.get('c').x);
  assert.deepEqual(first,directedLayout(nodes,edges));
});
test('layout tolerates cycles, parallel edges, self relations, and disconnected nodes', () => {
  const positions = directedLayout(['a','b','c'].map(id => node(id)), [edge('a','b'),edge('b','a'),edge('a','b','references'),edge('a','a')]);
  assert.equal(positions.size,3);
  for (const point of positions.values()) assert(Number.isFinite(point.x) && Number.isFinite(point.y));
});
test('point expansion follows the indexed branch independent of search filters', () => {
  assert.deepEqual(pointFilters(node('a'),['draft-branch']),{branches:['main']});
  assert.deepEqual(pointFilters({...node('a'),branch:null},['active']),{branches:['active']});
});


test('files remain distinct across folders and parallel relation types keep their directions', () => {
  const nodes = [node('a','api/a.ts'),node('b','lib/b.ts'),node('c','api/c.ts')];
  const edges = [edge('a','b'),edge('a','b','imports'),edge('b','a'),edge('a','c')];
  const graph = buildFileMap(nodes,edges);
  assert.equal(graph.nodes.length,3);
  assert.equal(graph.edges.length,4);
  assert.deepEqual(graph.edges.map(e=>[e.source,e.target,e.kind]),[
    ['file-map:api/a.ts','file-map:lib/b.ts','calls'],
    ['file-map:api/a.ts','file-map:lib/b.ts','imports'],
    ['file-map:lib/b.ts','file-map:api/a.ts','calls'],
    ['file-map:api/a.ts','file-map:api/c.ts','calls'],
  ]);
});
test('parallel and reciprocal arrows use distinct physical curves, independent of input order', () => {
  const edges = [edge('a','b'),edge('a','b','imports'),edge('b','a'),edge('b','c'),edge('c','d'),edge('c','d','references')];
  const curves = edgeCurvatures(edges);
  assert.equal(curves.get('b-c-calls'),0);
  assert.notEqual(curves.get('a-b-calls'),curves.get('a-b-imports'));
  // Reversing endpoints reverses the curve normal: equal signs bend to opposite sides.
  assert(curves.get('a-b-calls')>0 && curves.get('b-a-calls')>0);
  assert.notEqual(curves.get('c-d-calls'),curves.get('c-d-references'));
  assert.deepEqual(curves,edgeCurvatures([...edges].reverse()));
});
test('unresolved aggregate buckets cannot invent a path between unrelated files', () => {
  const nodes=[node('a'),node('b'),{...node('external',null),recordType:'external_aggregate'}];
  const distances=traceDistances(nodes,[edge('a','external'),edge('b','external')],'a',999999);
  assert.deepEqual([...distances.keys()],['a','external']);
});
test('server file projection is not reaggregated or counted as AST records', () => {
  const nodes=[{...node('file-map:0','a.ts'),recordType:'file_aggregate',metadata:{aggregate_record_count:28,internal_relations:30}}];
  const map=buildFileMap(nodes,[]);
  assert.equal(map.nodes,nodes);
  assert.equal(map.internalRelations,30);
});

test('dependency layout preserves files, is deterministic and independent of folders or parallel edge counts', () => {
  const nodes = Array.from({length:12},(_,i)=>node(`n${i}`,`folder${i%2}/n${i}.ts`));
  const edges=[];
  for(let start=0;start<10;start+=5) for(let i=start;i<start+5;i++) for(let j=i+1;j<start+5;j++) edges.push(edge(`n${i}`,`n${j}`));
  const positions=dependencyLayout(nodes,edges);
  assert.equal(positions.size,nodes.length);
  assert.equal(new Set([...positions.values()].map(p=>`${p.x},${p.y}`)).size,nodes.length);
  for(const p of positions.values()) assert(Number.isFinite(p.x)&&Number.isFinite(p.y));
  assert.deepEqual(positions,dependencyLayout([...nodes].reverse().map(n=>({...n,path:'different/folder.ts'})),[...edges].reverse()));
  assert.deepEqual(positions,dependencyLayout(nodes,[...edges,...edges.map(e=>({...e,id:e.id+'-copy'}))]));
  const distance=(a,b)=>Math.hypot(positions.get(a).x-positions.get(b).x,positions.get(a).y-positions.get(b).y);
  assert(distance('n0','n1')<distance('n0','n5'),'connected files should sit closer than unrelated groups');
  assert.equal(dependencyLayout([],[]).size,0);
});
