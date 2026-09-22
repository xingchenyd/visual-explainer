import unittest, sys, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import annealing_video as av

class AnnealingTests(unittest.TestCase):
    def test_operator_semantics_and_input_preserved(self):
        r=list(range(8))
        self.assertEqual(av.move(r,'swap',2,5),[0,1,5,3,4,2,6,7])
        self.assertEqual(av.move(r,'insert',5,2),[0,1,5,2,3,4,6,7])
        self.assertEqual(av.move(r,'2-opt',5,2),[0,1,5,4,3,2,6,7])
        self.assertEqual(r,list(range(8)))
    def test_all_moves_preserve_city_visits(self):
        for op in av.OPS:
            for i in range(1,8):
                for j in range(1,8):
                    if i!=j:
                        r=av.move(av.INITIAL,op,i,j)
                        self.assertEqual(sorted(r),list(range(8)))
                        self.assertEqual(r[0],0)
    def test_replay_and_reverse_route_distance(self):
        self.assertEqual(av.simulate(),av.simulate())
        self.assertAlmostEqual(av.cost(av.INITIAL),av.cost(list(reversed(av.INITIAL))))
    def test_both_acceptance_outcomes_and_best_archive(self):
        trace=av.simulate()
        self.assertTrue(any(r['delta']>0 and r['accepted'] for r in trace))
        self.assertTrue(any(r['delta']>0 and not r['accepted'] for r in trace))
        self.assertTrue(all(r['bestCost']<=r['cost']+1e-10 for r in trace))
        self.assertTrue(all(b['bestCost']<=a['bestCost'] for a,b in zip(trace,trace[1:])))
    def test_frame_history_independence(self):
        root=Path(__file__).resolve().parents[1]/'lessons/multi-operator-annealing'
        ir=json.loads((root/'lesson.ir.json').read_text(encoding='utf8'));trace=av.simulate()
        for s in ir['scenes']:
            t=s['start']+.5*s['duration'];a=av.frame(ir,trace,t).tobytes()
            av.frame(ir,trace,ir['duration']);av.frame(ir,trace,0)
            self.assertEqual(a,av.frame(ir,trace,t).tobytes())
        self.assertEqual(av.state_at(ir,ir['duration'])[0]['id'],'summary')
        self.assertEqual(av.state_at(ir,-1)[0]['id'],'intro')

if __name__=='__main__':unittest.main()
