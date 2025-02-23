import { USER_ALREADY_SIGNED_IN } from '../errors'
import { AuthInterpreter, PasswordlessOptions } from '../types'

import { ActionErrorState, ActionLoadingState, ActionSuccessState } from './types'

export interface SignInSmsPasswordlessState
  extends SignInSmsPasswordlessHandlerResult,
    ActionLoadingState {}

export interface SignInSmsPasswordlessHandlerResult extends ActionErrorState, ActionSuccessState {
  /**
   * Returns true when the one-time password has been sent over by SMS, and the user needs to send it back to complete sign-in.
   */
  needsOtp: boolean
}

export const signInSmsPasswordlessPromise = (
  interpreter: AuthInterpreter,
  phoneNumber: string,
  options?: PasswordlessOptions
) =>
  new Promise<SignInSmsPasswordlessHandlerResult>((resolve) => {
    const { changed } = interpreter.send('PASSWORDLESS_SMS', { phoneNumber, options })
    if (!changed) {
      return resolve({
        error: USER_ALREADY_SIGNED_IN,
        isError: true,
        isSuccess: false,
        needsOtp: false
      })
    }
    interpreter.onTransition((state) => {
      if (state.matches('registration.incomplete.needsOtp')) {
        resolve({
          error: null,
          isError: false,
          isSuccess: false,
          needsOtp: true
        })
      } else if (state.matches('registration.incomplete.failed')) {
        resolve({
          error: state.context.errors.authentication || null,
          isError: true,
          isSuccess: false,
          needsOtp: false
        })
      }
    })
  })
