// stats.js
// Small standalone module providing computeStats for Cp/Cpk and percentages.
// Works in browser (attaches to window) and in Node (module.exports).

(function(root){
  function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  function phi(x){
    return 0.5 * (1 + erf(x / Math.SQRT2));
  }

  function computeStats(mean, std, lsl, usl) {
    const inputsAreValid = (
      isFinite(mean) &&
      isFinite(std) &&
      std > 0 &&
      isFinite(lsl) &&
      isFinite(usl) &&
      usl > lsl
    );
    if (!inputsAreValid) return null;
    const cp = (usl - lsl) / (6 * std);
    const cpu = (usl - mean) / (3 * std);
    const cpl = (mean - lsl) / (3 * std);
    const cpk = Math.min(cpu, cpl);

    const zL = (lsl - mean) / std;
    const zU = (usl - mean) / std;
    const pctBelow = phi(zL) * 100;
    const pctAbove = (1 - phi(zU)) * 100;
    const pctInside = (phi(zU) - phi(zL)) * 100;
    const pctOutside = 100 - pctInside;

    return { cp, cpk, pctOutside, pctInside, pctAbove, pctBelow };
  }

  const exports = { erf, phi, computeStats };

  if (typeof module !== 'undefined' && module.exports) module.exports = exports;
  if (typeof root !== 'undefined') root.stats = exports;
})(typeof window !== 'undefined' ? window : global);
