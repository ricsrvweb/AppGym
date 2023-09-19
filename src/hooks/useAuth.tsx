import { useContext } from "react";

import { AuthContext } from "@contexts/AuthContext";

export function useAuht() {
    const context = useContext(AuthContext);

    return context;
}