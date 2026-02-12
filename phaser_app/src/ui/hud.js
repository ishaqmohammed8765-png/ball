export function createHud() {
  const stepText = document.getElementById("step-text");
  const aliveText = document.getElementById("alive-text");
  const hashText = document.getElementById("hash-text");
  const ffButton = document.getElementById("ff-btn");

  return {
    setStats(stepCount, aliveCount) {
      stepText.textContent = `Step: ${stepCount}`;
      aliveText.textContent = `Alive: ${aliveCount}`;
    },
    setHash(hash) {
      hashText.textContent = `Hash: ${hash}`;
    },
    setFastForward(enabled) {
      ffButton.classList.toggle("active", enabled);
    }
  };
}
