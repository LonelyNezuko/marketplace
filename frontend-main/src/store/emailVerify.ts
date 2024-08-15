import { CustomStorage } from "@modules/CustomStorage"
import { createSlice } from "@reduxjs/toolkit"

const emailVerify = createSlice({
    name: 'emailVerify',
    initialState: null,
    reducers: {
        emailVerifySetState: (state, action: { type: string, payload: boolean }) => {
            if(action.payload !== false && action.payload !== true)return state

            new CustomStorage().set('emailVerify', state)
            return action.payload
        }
    }
})

export const {
    emailVerifySetState
} = emailVerify.actions
export default emailVerify.reducer