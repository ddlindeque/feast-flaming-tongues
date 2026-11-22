const form = document.querySelector("#rsvp-form");

if (form instanceof HTMLFormElement) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    if (button instanceof HTMLButtonElement) button.disabled = true;

    try {
      const body = new URLSearchParams();
      new FormData(form).forEach((value, key) => {
        if (typeof value === "string") body.append(key, value);
      });
      const response = await fetch("/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
      });
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/login";
        return;
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload && typeof payload.error === "string" ? payload.error : "Could not save that. Try again.";
        window.location.href = `/?error=${encodeURIComponent(message)}#list`;
        return;
      }
      window.location.href = "/?joined=1#list";
    } catch {
      if (button instanceof HTMLButtonElement) button.disabled = false;
      form.submit();
    }
  });
}
