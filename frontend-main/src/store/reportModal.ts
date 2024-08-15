import { createSlice } from "@reduxjs/toolkit"

interface ReportModalState {
    toggle: boolean,
    type: 'product' | 'user',
    suspectID: number
}
const initialState = {
    toggle: false,
    type: null,
    suspectID: null
}

const reportModal = createSlice({
    name: 'reportModal',
    initialState,
    reducers: {
        reportModalHide: (state) => {
            return {
                toggle: false,
                suspectID: null,
                type: null
            }
        },
        reportModalShow: (state, action: { type: string, payload: ReportModalState }) => {
            if(!action.payload
                || !action.payload.suspectID
                || (action.payload.type !== 'product' && action.payload.type !== 'user'))return state

            return {
                toggle: true,
                suspectID: action.payload.suspectID,
                type: action.payload.type
            }
        }
    }
})

export const {
    reportModalHide,
    reportModalShow
} = reportModal.actions
export default reportModal.reducer