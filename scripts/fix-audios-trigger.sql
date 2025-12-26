    -- Fix trigger for audios table to use camelCase function
    -- The audios table uses "updatedAt" (camelCase) not "updated_at" (snake_case)

    -- Drop the existing trigger if it exists
    DROP TRIGGER IF EXISTS update_audios_updated_at ON audios;

    -- Recreate the trigger with the correct function for camelCase
    CREATE TRIGGER update_audios_updated_at 
    BEFORE UPDATE ON audios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_camelcase();

    -- Verify the trigger was created
    SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
    FROM information_schema.triggers 
    WHERE event_object_table = 'audios' 
    AND trigger_name = 'update_audios_updated_at';





