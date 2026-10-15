import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDirectoryMap, buildFileMap, directoryLayout, directedLayout, pointFilters, traceDistances } from '../src/components/RepositoryIndex/repositoryGraph.ts';
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


test('directory map conserves relation counts and directions at repository and folder scopes', () => {
  const nodes = Array.from({length:120}, (_,i) => ({...node(`n${i}`, `${i<60?'api':'lib'}/file${i}.ts`),recordType:'file_aggregate',metadata:{internal_relations:2}}));
  const edges = [
    {...edge('n0','n70'),metadata:{aggregateCount:12}},
    {...edge('n1','n71','imports'),metadata:{aggregateCount:3}},
    {...edge('n70','n0'),metadata:{aggregateCount:7}},
    {...edge('n0','n1'),metadata:{aggregateCount:5}},
  ];
  const overview = buildDirectoryMap({nodes,edges,internalRelations:240});
  assert.equal(overview.nodes.length,2);
  assert.equal(overview.fileCount,120);
  assert.equal(overview.edges.length,2);
  assert.equal(overview.edges.find(e=>e.source==='directory:api').weight,15);
  assert.equal(overview.edges.reduce((n,e)=>n+e.weight,overview.internalRelations),267);
  const scoped = buildDirectoryMap({nodes,edges,internalRelations:240},'api');
  assert.equal(scoped.nodes.length,60);
  assert.equal(scoped.outsideRelations,22);
  assert.equal(scoped.edges.length,1);
});
test('single-child directories compress to a useful scope and keep stable non-overlapping positions', () => {
  const nodes = Array.from({length:80}, (_,i)=>node(`n${i}`,`src/main/java/service/Item${i}.java`));
  const map = buildDirectoryMap({nodes,edges:[],internalRelations:0});
  assert.equal(map.nodes[0].path,'src/main/java/service');
  const positions=directoryLayout(nodes);
  assert.equal(new Set([...positions.values()].map(p=>`${p.x},${p.y}`)).size,80);
  assert.deepEqual(positions,directoryLayout([...nodes].reverse()));
});
test('server file projection is not reaggregated or counted as AST records', () => {
  const nodes=[{...node('file-map:0','a.ts'),recordType:'file_aggregate',metadata:{aggregate_record_count:28,internal_relations:30}}];
  const map=buildFileMap(nodes,[]);
  assert.equal(map.nodes,nodes);
  assert.equal(map.internalRelations,30);
});
