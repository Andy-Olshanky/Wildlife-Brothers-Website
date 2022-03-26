import { client } from "."
import { GetUserById, GetUserByIdRequest } from "../../../idl"

export const getUserById = (req: GetUserByIdRequest) => client.call(GetUserById, req)
