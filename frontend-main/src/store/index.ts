import { configureStore } from "@reduxjs/toolkit";

import reportModalReducer from './reportModal'
import emailVerifyReducer from './emailVerify'

const store = configureStore({
    reducer: {
        reportModalReducer,
        emailVerifyReducer
    }
})

export default store