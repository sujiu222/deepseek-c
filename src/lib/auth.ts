// next-auth
export async function loginOrSignUp(
  username: string,
  password: string,
  isSignup: boolean
) {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, isSignup: isSignup }),
  });
  const json = await res.json();
  return json;
}
