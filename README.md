# Inertia-TS

A library to validate and parse the environment into a state object. The
name inertia came from the idea of creating a type-safe validated snapshot of
the state of the environment at the start-up of and application. Validating both
the presence and shape (type) of supplied environment variables.

The `intertia-ts` package validates the presence and content of environment
variables. It does not set the environment but does read it for the values
defined in a schema object.  