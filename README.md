# theorem-prover-js

Simple propositional theorem prover written in javascript. To create a formula from a string use the `Parser`
in conjunction with the `tokenize()` function.

## How does it work

The main algorithm consists on *telling* facts to a `KB` instance and then asking for consequences. 
To do this, the input formulas are converted to their Conjunctive Normal Form, and then evaluated using
the resolution method.
