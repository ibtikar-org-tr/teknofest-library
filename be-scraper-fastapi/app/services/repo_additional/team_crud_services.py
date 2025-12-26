from app.repositories import team_crud
from app.repositories import competition_crud
from app.services.repo_additional import competition_crud_services
from app.models.team import Team
from app.models.competition import Report_File

def get_teams_by_competition_en_name(name: str):
    competition_crud_class = competition_crud.CompetitionCRUD()
    competition_obj = competition_crud_class.get_competition_by_en_name(name)
    if competition_obj is None:
        return None
    team_crud_class = team_crud.TeamCRUD()
    return team_crud_class.get_teams_by_competition_id(competition_obj.id)

def update_or_create_team(
    name,
    members_list,
    description,
    institution_name,
    comp_name,
    year,
    report_file_path,
    intro_file_path,
    team_link,
    status
):
    print(f"""
          received team info:
            name: {name}
            members_list: {members_list}
            description: {description}
            institution_name: {institution_name}
            comp_name: {comp_name}
            year: {year}
            report_file_path: {report_file_path}
            intro_file_path: {intro_file_path}
            team_link: {team_link}
            status: {status}
        """)
    try:
        team_obj_new: Team = Team()
        team_crud_class = team_crud.TeamCRUD()
        team_obj_from_db = None

        competition_obj = competition_crud_services.get_competition_obj_via_any_name(comp_name)
        if competition_obj:
            competition_id = competition_obj.id
            # team_obj_from_db = team_crud_class.get_team_by_name_and_year(name=name, year=int(year))
            team_obj_from_db = team_crud_class.get_team_by_competition_id_and_name(competition_id=competition_id, name=name)
        else:
            print(f"ERROR0: Competition not found: {comp_name}")
            return None

        if team_obj_from_db: # update existing team
            if members_list:
                team_obj_new.members_list = members_list
            if description:
                team_obj_new.description = description
            if institution_name:
                team_obj_new.institution_name = institution_name
            if status:
                team_obj_new.competition_id = competition_id
            if year:
                team_obj_new.years.append(year)
            if intro_file_path:
                team_obj_new.intro_file_path = intro_file_path
            if team_link:
                team_obj_new.team_link = team_link
            if status:
                team_obj_new.status = status

            team_crud_class.update_team(team_obj_from_db.id, team_obj_new)
            team_obj_new.id = team_obj_from_db.id # to use in report_file creation

        else: # create new team
            team_obj_new = Team(
                name=name,
                members_list=members_list,
                description=description,
                institution_name=institution_name,
                competition_id=competition_obj.id,
                years=[year],
                intro_file_path=intro_file_path,
                team_link=team_link,
                status=status
            )
            team_crud_class.create_team(team_obj_new)

        if report_file_path is not None:
            report_file = Report_File(
                competition_id=competition_id,
                team_id=team_obj_new.id,
                year=year,
                file_path=report_file_path,
                rank=status
            )
            report_file_crud_class = team_crud.ReportFileCRUD()
            report_file_crud_class.create_report_file(report_file)

        return team_obj_new
    except Exception as e:
        print(f"Error while updating or creating team: {e}")
        return None