import http  from "./http";

export async function getRecentBattlesApi(limit = 20) {
  const { data } = await http.get(`/api/history`, {
    params: { limit },
  });
  return data; // {ok:true, battles:[...]}
}

export async function getBattleDetailsApi(roomCode) {
  const { data } = await http.get(`/api/history/${roomCode}`);
  return data; 
}