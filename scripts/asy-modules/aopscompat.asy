// Compatibility module loaded last by scripts/render-diagrams.ts.
//
// It is deliberately almost empty. Earlier attempts to shim 2008-era positional calls
// such as Ticks(f, 2.0) or xaxis(-3, 3, ticks) made every such call *ambiguous*:
// Asymptote already matches them against the modern signatures by skipping defaulted
// parameters, so an extra overload with the same argument types cannot be chosen
// over the original. The real cause of those failures was the stock olympiad.asy,
// which `include`d graph and so duplicated every graph symbol; that file is patched
// to `import graph;` instead. Keep this module as the place for any future shim.
access graph;
